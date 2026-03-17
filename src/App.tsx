import { useState, useEffect } from 'react';
import { auth, signInWithGoogle, logOut, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from './types';
import { Navbar } from './components/Navbar';
import { RideBooking } from './components/RideBooking';
import { ChatBot } from './components/ChatBot';
import { AIGenerator } from './components/AIGenerator';
import { motion, AnimatePresence } from 'motion/react';
import { Car, MessageSquare, Sparkles, User as UserIcon, LogIn } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'ride' | 'chat' | 'ai'>('ride');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            photoURL: firebaseUser.photoURL || '',
            role: 'rider',
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Car className="w-12 h-12 text-black" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center"
        >
          <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Car className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Uber Clone</h1>
          <p className="text-slate-500 mb-8">Get there with ease. Sign in to start your journey.</p>
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-black text-white py-4 rounded-xl font-semibold hover:bg-slate-800 transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <Navbar profile={profile} onLogout={logOut} />
      
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'ride' && (
            <motion.div
              key="ride"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              <RideBooking />
            </motion.div>
          )}
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              <ChatBot />
            </motion.div>
          )}
          {activeTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              <AIGenerator />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="bg-white border-t border-slate-200 px-6 py-3 pb-8 md:pb-3">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          <TabButton
            active={activeTab === 'ride'}
            onClick={() => setActiveTab('ride')}
            icon={<Car className="w-6 h-6" />}
            label="Ride"
          />
          <TabButton
            active={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
            icon={<MessageSquare className="w-6 h-6" />}
            label="Support"
          />
          <TabButton
            active={activeTab === 'ai'}
            onClick={() => setActiveTab('ai')}
            icon={<Sparkles className="w-6 h-6" />}
            label="Creative"
          />
        </div>
      </nav>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-black' : 'text-slate-400'}`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
