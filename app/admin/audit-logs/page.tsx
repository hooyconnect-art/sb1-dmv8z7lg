'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, User, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  ip_address: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterResource, setFilterResource] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, [filterAction, filterResource]);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        profiles(full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (filterAction !== 'all') {
      query = query.eq('action', filterAction);
    }

    if (filterResource !== 'all') {
      query = query.eq('resource_type', filterResource);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      create: 'text-green-600 bg-green-50',
      update: 'text-blue-600 bg-blue-50',
      delete: 'text-red-600 bg-red-50',
      approve: 'text-green-600 bg-green-50',
      reject: 'text-red-600 bg-red-50',
      login: 'text-purple-600 bg-purple-50',
      logout: 'text-gray-600 bg-gray-50',
    };
    return colors[action] || 'text-gray-600 bg-gray-50';
  };

  const filteredLogs = logs.filter(log =>
    log.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    log.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.resource_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Audit Logs</h1>
          <p className="text-muted-foreground mt-2">Track system activity and user actions</p>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterResource} onValueChange={setFilterResource}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="listing">Listing</SelectItem>
                  <SelectItem value="property">Property</SelectItem>
                  <SelectItem value="booking">Booking</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-brand-green transition-colors"
                  >
                    <div className="mt-1">
                      <Shield className="h-5 w-5 text-brand-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${getActionColor(log.action)}`}>
                          {log.action.toUpperCase()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {log.resource_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{log.profiles?.full_name || 'Unknown User'}</span>
                        <span className="text-muted-foreground">({log.profiles?.email})</span>
                      </div>
                      {log.resource_id && (
                        <div className="text-xs text-muted-foreground">
                          Resource ID: <code className="bg-gray-100 px-2 py-1 rounded">{log.resource_id}</code>
                        </div>
                      )}
                      {log.ip_address && (
                        <div className="text-xs text-muted-foreground mt-1">
                          IP: {log.ip_address}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      {format(new Date(log.created_at), 'MMM dd, yyyy')}
                      <br />
                      {format(new Date(log.created_at), 'HH:mm:ss')}
                    </div>
                  </div>
                ))}

                {filteredLogs.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No audit logs found</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Security & Compliance</h3>
                <p className="text-sm text-blue-800">
                  Audit logs track all critical actions performed by users in the system.
                  These logs are retained for security, compliance, and troubleshooting purposes.
                  Only super admins and admins have access to view these logs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
