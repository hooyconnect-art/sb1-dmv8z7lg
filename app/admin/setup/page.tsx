'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Key, Users } from 'lucide-react';

export default function AdminSetup() {
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    synced?: number;
  } | null>(null);

  const handleSync = async () => {
    if (!serviceRoleKey || serviceRoleKey.length < 20) {
      setResult({
        success: false,
        message: 'Please enter a valid service role key'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/sync-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceRoleKey }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setTimeout(() => {
          setServiceRoleKey('');
        }, 3000);
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-navy mb-2">
            Admin Setup Tool
          </h1>
          <p className="text-muted-foreground">
            One-time setup to configure your admin environment
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-brand-green" />
              Configure Service Role Key
            </CardTitle>
            <CardDescription>
              This tool will sync all user roles from user_metadata to app_metadata (required for security)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>How to get your service role key:</strong>
                <ol className="list-decimal ml-4 mt-2 space-y-1">
                  <li>Go to: <a href="https://supabase.com/dashboard/project/szdnbrxfwckxceeywewh/settings/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase API Settings</a></li>
                  <li>Find the "service_role" key (NOT the anon key)</li>
                  <li>Click "Copy" and paste it below</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="serviceKey">Service Role Key</Label>
              <Input
                id="serviceKey"
                type="password"
                value={serviceRoleKey}
                onChange={(e) => setServiceRoleKey(e.target.value)}
                placeholder="eyJhbGci..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This key is only used for this one-time sync and is not stored anywhere
              </p>
            </div>

            <Button
              onClick={handleSync}
              disabled={loading || !serviceRoleKey}
              className="w-full bg-brand-green hover:bg-brand-green/90 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Syncing Users...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Sync User Roles
                </>
              )}
            </Button>

            {result && (
              <Alert className={result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                  {result.message}
                  {result.synced !== undefined && (
                    <div className="mt-2 font-semibold">
                      Successfully synced {result.synced} users
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="border-t pt-4">
              <h4 className="font-semibold text-sm mb-2">What This Does:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Migrates user roles from user_metadata to app_metadata</li>
                <li>• Fixes "Failed to fetch users" error</li>
                <li>• Enables all admin features</li>
                <li>• Improves security (app_metadata cannot be edited by users)</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">
                For Bolt Users (No .env Access):
              </p>
              <p className="text-sm text-blue-700">
                Since you're using Bolt, you'll need to run this setup tool each time you restart your environment,
                OR configure the SUPABASE_SERVICE_ROLE_KEY in Bolt's environment variables if available.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            After setup is complete, go to{' '}
            <a href="/admin/users" className="text-brand-green hover:underline">
              Admin Dashboard → Users
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
