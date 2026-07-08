import { Users, UserPlus, Shield } from "lucide-react";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Users</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage access and roles</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white">
          <UserPlus className="h-4 w-4" /> Add User
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col items-center justify-center py-12">
          <Users className="mb-4 h-12 w-12 text-text-muted" />
          <h3 className="text-lg font-medium text-text-primary">User Management</h3>
          <p className="mt-2 text-center text-sm text-text-secondary max-w-md">
            The User Management module allows administrators to create accounts, assign roles, and manage permissions.
          </p>
        </div>
      </div>
    </div>
  );
}
