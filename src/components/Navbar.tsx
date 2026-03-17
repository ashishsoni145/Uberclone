import { UserProfile } from '../types';
import { LogOut, User as UserIcon } from 'lucide-react';

export function Navbar({ profile, onLogout }: { profile: UserProfile | null, onLogout: () => void }) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
          <span className="text-white font-bold text-lg">U</span>
        </div>
        <span className="font-bold text-xl tracking-tight">Uber</span>
      </div>
      
      <div className="flex items-center gap-4">
        {profile && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{profile.displayName}</p>
              <p className="text-xs text-slate-500 capitalize">{profile.role}</p>
            </div>
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-slate-200" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                <UserIcon className="w-6 h-6 text-slate-400" />
              </div>
            )}
            <button
              onClick={onLogout}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
