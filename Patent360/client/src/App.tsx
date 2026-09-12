import { useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { Backdrop } from './components/Backdrop';
import { Notices } from './components/Notices';
import { Home } from './pages/Home';
import { How } from './pages/How';
import { Login } from './pages/Login';
import { Shell } from './components/Shell';
import { Options } from './pages/Options';
import { Variants } from './pages/Variants';
import type { Role } from './lib/nav';

export type Session = { name: string; email: string; role: Role; firm: string } | null;

export function App() {
  const [session, setSession] = useState<Session>(null);
  const [, navigate] = useLocation();

  return (
    <>
      <Backdrop dense={typeof window !== 'undefined' && window.location.pathname.startsWith('/app')} />
      {/* Mounted once for the whole app: every action reports here. */}
      <Notices />
      <Switch>
        <Route path="/options"><Options /></Route>
        <Route path="/v"><Variants /></Route>
        <Route path="/how"><How /></Route>
        <Route path="/login">
          <Login
            onSignIn={s => {
              setSession(s);
              navigate('/app');
            }}
          />
        </Route>
        <Route path="/app/*">
          <Shell session={session} onRole={r => setSession(s => (s ? { ...s, role: r } : s))} onSignOut={() => { setSession(null); navigate('/'); }} />
        </Route>
        <Route path="/app">
          <Shell session={session} onRole={r => setSession(s => (s ? { ...s, role: r } : s))} onSignOut={() => { setSession(null); navigate('/'); }} />
        </Route>
        <Route><Home /></Route>
      </Switch>
    </>
  );
}
