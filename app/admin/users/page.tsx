'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Search, Shield, Trash2, UserPlus, Eye, EyeOff, Edit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  verified: boolean;
  status: string;
  property_types: string[];
  created_at: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isCreateHostDialogOpen, setIsCreateHostDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [autoGeneratePassword, setAutoGeneratePassword] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [hostFormData, setHostFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'host' as 'host',
    status: 'active' as 'active' | 'suspended',
    propertyTypes: {
      'Hotel': false,
      'Fully Furnished': false,
      'Property for Sale': false,
    },
  });

  const [editFormData, setEditFormData] = useState({
    fullName: '',
    phone: '',
    role: 'guest' as 'guest' | 'host' | 'admin' | 'super_admin',
    status: 'active' as 'active' | 'suspended',
    propertyTypes: {
      'Hotel': false,
      'Fully Furnished': false,
      'Property for Sale': false,
    },
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, users]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/list');
      const result = await response.json();

      if (!result.success) {
        toast.error('Failed to fetch users');
        console.error(result.error);
      } else {
        setUsers(result.users);
        setFilteredUsers(result.users);
      }
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error(error);
    }
    setLoading(false);
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch('/api/users/change-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newRole }),
      });
      const result = await response.json();

      if (!result.success) {
        toast.error('Failed to update user role');
        console.error(result.error);
      } else {
        toast.success(`User role updated to ${newRole}`);
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to update user role');
      console.error(error);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    try {
      const response = await fetch('/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deleteUserId, hardDelete: true }),
      });
      const result = await response.json();

      if (!result.success) {
        toast.error('Failed to delete user');
        console.error(result.error);
      } else {
        toast.success('User deleted successfully');
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to delete user');
      console.error(error);
    }
    setDeleteUserId(null);
  };

  const handleVerifyUser = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/users/toggle-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentVerified: currentStatus }),
      });
      const result = await response.json();

      if (!result.success) {
        toast.error('Failed to update verification status');
        console.error(result.error);
      } else {
        toast.success(`User ${result.verified ? 'verified' : 'unverified'} successfully`);
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to update verification status');
      console.error(error);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      const response = await fetch('/api/users/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentStatus }),
      });
      const result = await response.json();

      if (!result.success) {
        toast.error('Failed to update user status');
        console.error(result.error);
      } else {
        toast.success(`User ${result.newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to update user status');
      console.error(error);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      fullName: user.full_name,
      phone: user.phone || '',
      role: user.role as 'guest' | 'host' | 'admin' | 'super_admin',
      status: (user.status as 'active' | 'suspended') || 'active',
      propertyTypes: {
        'Hotel': user.property_types?.includes('Hotel') || false,
        'Fully Furnished': user.property_types?.includes('Fully Furnished') || false,
        'Property for Sale': user.property_types?.includes('Property for Sale') || false,
      },
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUser) return;

    const selectedPropertyTypes = Object.entries(editFormData.propertyTypes)
      .filter(([_, selected]) => selected)
      .map(([type, _]) => type);

    if (editFormData.role === 'host' && selectedPropertyTypes.length === 0) {
      toast.error('Please select at least one property type for host users');
      return;
    }

    setIsUpdating(true);

    try {
      if (editFormData.role !== editingUser.role) {
        const roleResponse = await fetch('/api/users/change-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: editingUser.id, newRole: editFormData.role }),
        });
        const roleResult = await roleResponse.json();

        if (!roleResult.success) {
          toast.error('Failed to update user role');
          console.error(roleResult.error);
          setIsUpdating(false);
          return;
        }
      }

      const response = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          fullName: editFormData.fullName,
          phone: editFormData.phone || null,
          status: editFormData.status,
          propertyTypes: editFormData.role === 'host' ? selectedPropertyTypes : [],
        }),
      });
      const result = await response.json();

      if (!result.success) {
        toast.error('Failed to update user');
        console.error(result.error);
      } else {
        toast.success('User updated successfully');
        setIsEditDialogOpen(false);
        setEditingUser(null);
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateHost = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedPropertyTypes = Object.entries(hostFormData.propertyTypes)
      .filter(([_, selected]) => selected)
      .map(([type, _]) => type);

    if (hostFormData.role === 'host' && selectedPropertyTypes.length === 0) {
      toast.error('Please select at least one property type for host users');
      return;
    }

    setIsCreating(true);

    try {
      const password = autoGeneratePassword ? generatePassword() : hostFormData.password;

      if (!autoGeneratePassword && hostFormData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        setIsCreating(false);
        return;
      }

      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: hostFormData.email,
          password: password,
          fullName: hostFormData.fullName,
          phone: hostFormData.phone || null,
          role: hostFormData.role,
          propertyTypes: hostFormData.role === 'host' ? selectedPropertyTypes : [],
          status: hostFormData.status,
        }),
      });
      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Failed to create host');
        setIsCreating(false);
        return;
      }

      toast.success(
        `Host created successfully! ${autoGeneratePassword ? `Password: ${password}` : ''}`,
        { duration: 10000 }
      );
      setIsCreateHostDialogOpen(false);
      setHostFormData({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        status: 'active',
        propertyTypes: {
          'Hotel': false,
          'Fully Furnished': false,
          'Property for Sale': false,
        },
      });
      setAutoGeneratePassword(true);
      fetchUsers();
    } catch (error) {
      console.error('Error creating host:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'host':
        return 'bg-green-100 text-green-800';
      case 'guest':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const roleStats = {
    total: users.length,
    superAdmin: users.filter((u) => u.role === 'super_admin').length,
    admin: users.filter((u) => u.role === 'admin').length,
    host: users.filter((u) => u.role === 'host').length,
    guest: users.filter((u) => u.role === 'guest').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brand-navy">Users Management</h1>
            <p className="text-muted-foreground mt-2">
              View and manage all platform users
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2 text-sm">
              <Users className="h-5 w-5 text-brand-green" />
              <span className="font-semibold">{filteredUsers.length}</span>
              <span className="text-muted-foreground">
                of {users.length} users
              </span>
            </div>
            <Dialog open={isCreateHostDialogOpen} onOpenChange={setIsCreateHostDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-brand-green hover:bg-brand-green/90 text-white">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Host
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Host User</DialogTitle>
                  <DialogDescription>
                    Create a new host account to manage property listings
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateHost} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={hostFormData.fullName}
                        onChange={(e) => setHostFormData({ ...hostFormData, fullName: e.target.value })}
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={hostFormData.email}
                        onChange={(e) => setHostFormData({ ...hostFormData, email: e.target.value })}
                        placeholder="host@example.com"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={hostFormData.phone}
                        onChange={(e) => setHostFormData({ ...hostFormData, phone: e.target.value })}
                        placeholder="+252 61 234 5678"
                      />
                    </div>

                    <div>
                      <Label>User Role *</Label>
                      <Select
                        value={hostFormData.role}
                        onValueChange={(value: 'host') =>
                          setHostFormData({ ...hostFormData, role: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="host">Host</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id="autoPassword"
                          checked={autoGeneratePassword}
                          onCheckedChange={(checked) => setAutoGeneratePassword(checked as boolean)}
                        />
                        <Label htmlFor="autoPassword" className="font-normal cursor-pointer">
                          Auto-generate secure password
                        </Label>
                      </div>

                      {!autoGeneratePassword && (
                        <div className="relative">
                          <Label htmlFor="password">Password *</Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              value={hostFormData.password}
                              onChange={(e) => setHostFormData({ ...hostFormData, password: e.target.value })}
                              placeholder="Minimum 6 characters"
                              required={!autoGeneratePassword}
                              minLength={6}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Account Status *</Label>
                      <Select
                        value={hostFormData.status}
                        onValueChange={(value: 'active' | 'suspended') =>
                          setHostFormData({ ...hostFormData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {hostFormData.role === 'host' && (
                    <div>
                      <Label className="mb-3 block">Property Types Allowed *</Label>
                      <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="hotel"
                            checked={hostFormData.propertyTypes['Hotel']}
                            onCheckedChange={(checked) =>
                              setHostFormData({
                                ...hostFormData,
                                propertyTypes: { ...hostFormData.propertyTypes, 'Hotel': checked as boolean },
                              })
                            }
                          />
                          <div className="flex-1">
                            <Label htmlFor="hotel" className="font-medium cursor-pointer">
                              Hotel
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Allow host to create hotel listings (15% commission)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="furnished"
                            checked={hostFormData.propertyTypes['Fully Furnished']}
                            onCheckedChange={(checked) =>
                              setHostFormData({
                                ...hostFormData,
                                propertyTypes: { ...hostFormData.propertyTypes, 'Fully Furnished': checked as boolean },
                              })
                            }
                          />
                          <div className="flex-1">
                            <Label htmlFor="furnished" className="font-medium cursor-pointer">
                              Fully Furnished
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Allow host to create fully furnished properties (12% commission)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="propertysale"
                            checked={hostFormData.propertyTypes['Property for Sale']}
                            onCheckedChange={(checked) =>
                              setHostFormData({
                                ...hostFormData,
                                propertyTypes: { ...hostFormData.propertyTypes, 'Property for Sale': checked as boolean },
                              })
                            }
                          />
                          <div className="flex-1">
                            <Label htmlFor="propertysale" className="font-medium cursor-pointer">
                              Property for Sale
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Allow host to create property sales listings (custom commission)
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Select at least one property type
                      </p>
                    </div>
                    )}

                    <div className="border-t pt-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-900 font-medium mb-1">Role Information</p>
                        <p className="text-sm text-blue-700">
                          Host users can create and manage property listings with specific property type permissions.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateHostDialogOpen(false)}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-brand-green hover:bg-brand-green/90 text-white"
                      disabled={isCreating}
                    >
                      {isCreating ? 'Creating Host...' : 'Create Host User'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold text-brand-navy">{roleStats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Admins</p>
              <p className="text-2xl font-bold text-red-600">{roleStats.admin}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Hosts</p>
              <p className="text-2xl font-bold text-blue-600">{roleStats.host}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Guests</p>
              <p className="text-2xl font-bold text-gray-600">{roleStats.guest}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <CardTitle>All Users</CardTitle>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="host">Host</SelectItem>
                    <SelectItem value="guest">Guest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-semibold text-sm text-brand-navy">
                        Full Name
                      </th>
                      <th className="text-left p-4 font-semibold text-sm text-brand-navy">
                        Email
                      </th>
                      <th className="text-left p-4 font-semibold text-sm text-brand-navy">
                        Current Role
                      </th>
                      <th className="text-left p-4 font-semibold text-sm text-brand-navy">
                        Account Status
                      </th>
                      <th className="text-left p-4 font-semibold text-sm text-brand-navy">
                        Verification
                      </th>
                      <th className="text-left p-4 font-semibold text-sm text-brand-navy">
                        Property Types
                      </th>
                      <th className="text-left p-4 font-semibold text-sm text-brand-navy">
                        Joined
                      </th>
                      <th className="text-left p-4 font-semibold text-sm text-brand-navy">
                        Change Role
                      </th>
                      <th className="text-left p-4 font-semibold text-sm text-brand-navy">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <p className="font-medium text-brand-navy">{user.full_name}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </td>
                        <td className="p-4">
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge
                            className={
                              user.status === 'active'
                                ? 'bg-green-100 text-green-800 cursor-pointer hover:bg-green-200'
                                : 'bg-red-100 text-red-800 cursor-pointer hover:bg-red-200'
                            }
                            onClick={() => handleToggleStatus(user.id, user.status)}
                          >
                            {user.status === 'active' ? 'Active' : 'Suspended'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge
                            className={
                              user.verified
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {user.verified ? 'Verified' : 'Unverified'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {user.role === 'host' && user.property_types && user.property_types.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {user.property_types.map((type) => (
                                <Badge key={type} variant="outline" className="text-xs">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="p-4">
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleRoleChange(user.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="guest">Guest</SelectItem>
                              <SelectItem value="host">Host</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(user)}
                              title="Edit user"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerifyUser(user.id, user.verified)}
                              title={user.verified ? 'Unverify user' : 'Verify user'}
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteUserId(user.id)}
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No users found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleUpdateUser} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editFullName">Full Name *</Label>
                  <Input
                    id="editFullName"
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editingUser.email}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <Label htmlFor="editPhone">Phone Number</Label>
                  <Input
                    id="editPhone"
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    placeholder="+252 61 234 5678"
                  />
                </div>

                <div>
                  <Label>Account Status *</Label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(value: 'active' | 'suspended') =>
                      setEditFormData({ ...editFormData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>User Role *</Label>
                  <Select
                    value={editFormData.role}
                    onValueChange={(value: 'guest' | 'host' | 'admin' | 'super_admin') =>
                      setEditFormData((prev) => {
                        if (value === 'host') {
                          const hasAnyType = Object.values(prev.propertyTypes).some(Boolean);
                          return {
                            ...prev,
                            role: value,
                            propertyTypes: hasAnyType
                              ? prev.propertyTypes
                              : { ...prev.propertyTypes, 'Fully Furnished': true },
                          };
                        }
                        return {
                          ...prev,
                          role: value,
                          propertyTypes: { 'Hotel': false, 'Fully Furnished': false, 'Property for Sale': false },
                        };
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guest">Guest</SelectItem>
                      <SelectItem value="host">Host</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editFormData.role === 'host' && (
                  <div>
                    <Label className="mb-3 block">Property Types Allowed *</Label>
                    <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="editHotel"
                          checked={editFormData.propertyTypes['Hotel']}
                          onCheckedChange={(checked) =>
                            setEditFormData({
                              ...editFormData,
                              propertyTypes: { ...editFormData.propertyTypes, 'Hotel': checked as boolean },
                            })
                          }
                        />
                        <div className="flex-1">
                          <Label htmlFor="editHotel" className="font-medium cursor-pointer">
                            Hotel
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Allow host to create hotel listings (15% commission)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="editFurnished"
                          checked={editFormData.propertyTypes['Fully Furnished']}
                          onCheckedChange={(checked) =>
                            setEditFormData({
                              ...editFormData,
                              propertyTypes: { ...editFormData.propertyTypes, 'Fully Furnished': checked as boolean },
                            })
                          }
                        />
                        <div className="flex-1">
                          <Label htmlFor="editFurnished" className="font-medium cursor-pointer">
                            Fully Furnished
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Allow host to create fully furnished properties (12% commission)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="editPropertySale"
                          checked={editFormData.propertyTypes['Property for Sale']}
                          onCheckedChange={(checked) =>
                            setEditFormData({
                              ...editFormData,
                              propertyTypes: { ...editFormData.propertyTypes, 'Property for Sale': checked as boolean },
                            })
                          }
                        />
                        <div className="flex-1">
                          <Label htmlFor="editPropertySale" className="font-medium cursor-pointer">
                            Property for Sale
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Allow host to create property sales listings (custom commission)
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Select at least one property type
                    </p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-900 font-medium mb-1">Current Role: {editingUser.role}</p>
                    <p className="text-xs text-blue-700">
                      You can change a user's role here. Property types apply only to hosts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-brand-green hover:bg-brand-green/90 text-white"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Update User'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this user and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
