import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Search, LogOut, Users, Check, X } from 'lucide-react';

interface Team {
  id: number;
  name: string;
}

interface Expense {
  id: number;
  amount: number;
  description: string;
  paid_by_username: string;
  created_at: string;
  user_paid: boolean;
  user_share: number;
}

export const Dashboard = () => {
  const { token, logout } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamPasscode, setNewTeamPasscode] = useState('');
  const [newExpense, setNewExpense] = useState({ amount: '', description: '' });

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const searchTeams = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/teams/search?query=${searchQuery}`, { headers });
      setTeams(response.data);
    } catch (error) {
      console.error('Error searching teams:', error);
    }
  };

  const createTeam = async () => {
    try {
      await axios.post('http://localhost:3000/api/teams', {
        name: newTeamName,
        passcode: newTeamPasscode,
      }, { headers });
      setShowCreateTeam(false);
      setNewTeamName('');
      setNewTeamPasscode('');
      searchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const joinTeam = async () => {
    try {
      await axios.post('http://localhost:3000/api/teams/join', {
        teamId: selectedTeam,
        passcode: newTeamPasscode,
      }, { headers });
      setShowJoinTeam(false);
      setNewTeamPasscode('');
      searchTeams();
    } catch (error) {
      console.error('Error joining team:', error);
    }
  };

  const addExpense = async () => {
    if (!selectedTeam) return;
    try {
      await axios.post('http://localhost:3000/api/expenses', {
        teamId: selectedTeam,
        amount: parseFloat(newExpense.amount),
        description: newExpense.description,
      }, { headers });
      setNewExpense({ amount: '', description: '' });
      fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const payExpense = async (expenseId: number) => {
    try {
      await axios.post(`http://localhost:3000/api/expenses/${expenseId}/pay`, {}, { headers });
      fetchExpenses();
    } catch (error) {
      console.error('Error paying expense:', error);
    }
  };

  const fetchExpenses = async () => {
    if (!selectedTeam) return;
    try {
      const response = await axios.get(`http://localhost:3000/api/teams/${selectedTeam}/expenses`, { headers });
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  useEffect(() => {
    searchTeams();
  }, [searchQuery]);

  useEffect(() => {
    if (selectedTeam) {
      fetchExpenses();
    }
  }, [selectedTeam]);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">Expense Tracker</span>
            </div>
            <div className="flex items-center">
              <button
                onClick={logout}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Teams Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Teams</h2>
              <button
                onClick={() => setShowCreateTeam(true)}
                className="text-indigo-600 hover:text-indigo-700"
              >
                <PlusCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center mb-4">
              <input
                type="text"
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <Search className="h-5 w-5 ml-2 text-gray-400" />
            </div>

            <div className="space-y-2">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeam(team.id)}
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    selectedTeam === team.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {team.name}
                </button>
              ))}
            </div>
          </div>

          {/* Expenses Section */}
          <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Expenses</h2>
              {selectedTeam && (
                <button
                  onClick={() => setShowJoinTeam(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Join with Passcode
                </button>
              )}
            </div>

            {selectedTeam ? (
              <>
                <div className="mb-6">
                  <div className="flex space-x-4">
                    <input
                      type="number"
                      placeholder="Amount"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      className="flex-2 px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <button
                      onClick={addExpense}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{expense.description}</p>
                        <p className="text-sm text-gray-500">
                          Paid by {expense.paid_by_username} on{' '}
                          {new Date(expense.created_at).toLocaleDateString()}
                        </p>
                    <p className="text-sm text-gray-500">
  Your share: ${expense.user_share != null ? `${expense.user_share}` : '0.00'}
</p>

                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-semibold text-gray-900">
                          {expense.amount}
                        </span>
                        {!expense.user_paid ? (
                           <span className="flex items-center text-green-600">
                           <Check className="h-4 w-4 mr-1" />
                           {expense.paid_by_username}
                         </span>
                        ) : (
                          <span className="flex items-center text-green-600">
                            <Check className="h-4 w-4 mr-1" />
                            Paid by You
                                                      </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500">
                Select a team to view expenses
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Team</h3>
            <input
              type="text"
              placeholder="Team Name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
            />
            <input
              type="text"
              placeholder="Passcode"
              value={newTeamPasscode}
              onChange={(e) => setNewTeamPasscode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowCreateTeam(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={createTeam}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Team Modal */}
      {showJoinTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Join Team</h3>
            <input
              type="text"
              placeholder="Passcode"
              value={newTeamPasscode}
              onChange={(e) => setNewTeamPasscode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowJoinTeam(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={joinTeam}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};