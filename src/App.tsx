/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SplashView } from './components/SplashView';
import { AuthView } from './components/AuthView';
import { SetupView } from './components/SetupView';
import { MainDashboard } from './components/MainDashboard';
import { getPreferences } from './services/storage';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<'splash' | 'login' | 'setup' | 'main'>('splash');
  const [isOpenedFromSettings, setIsOpenedFromSettings] = useState(false);

  const handleSplashNavigate = (route: 'login' | 'setup' | 'main') => {
    setCurrentRoute(route);
  };

  const handleAuthSuccess = (route: 'setup' | 'main') => {
    setCurrentRoute(route);
  };

  const handleSetupComplete = () => {
    setIsOpenedFromSettings(false);
    setCurrentRoute('main');
  };

  const handleOpenSettings = () => {
    setIsOpenedFromSettings(true);
    setCurrentRoute('setup');
  };

  const handleLogout = () => {
    setCurrentRoute('login');
  };

  return (
    <main className="w-full min-h-screen bg-[#050505] text-[#F8FAFC]">
      {currentRoute === 'splash' && (
        <SplashView onNavigate={handleSplashNavigate} />
      )}

      {currentRoute === 'login' && (
        <AuthView onSuccess={handleAuthSuccess} />
      )}

      {currentRoute === 'setup' && (
        <SetupView
          onComplete={handleSetupComplete}
          canGoBack={isOpenedFromSettings}
          onBack={() => {
            setIsOpenedFromSettings(false);
            setCurrentRoute('main');
          }}
        />
      )}

      {currentRoute === 'main' && (
        <MainDashboard
          onOpenSettings={handleOpenSettings}
          onLogout={handleLogout}
        />
      )}
    </main>
  );
}
