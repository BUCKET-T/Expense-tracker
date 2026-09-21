import React, { useState, useEffect, useRef } from 'react';
import supabase from '../../config/supabaseClient';
import './settings.css';

export default function Settings() {
  useEffect(() => {
  document.title = "Settings | E-Tracker";
}, []);

  const [activeTab, setActiveTab] = useState('profile');
  const [userCreds, setUserCreds] = useState({
    fullName: '',
    email: '',
    username: '',
    avatarUrl: null
  });
  const [originalEmail, setOriginalEmail] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [theme, setTheme] = useState('dark');
  
  const fileInputRef = useRef(null);

  // Load user details from Supabase Auth & 'profiles' table
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, username, avatar_url')
            .eq('id', user.id)
            .maybeSingle();

          if (profileError) throw profileError;

          setUserCreds({
            fullName: profile?.full_name || '',
            email: user.email || '',
            username: profile?.username || '',
            avatarUrl: profile?.avatar_url || null
          });
          setOriginalEmail(user.email || '');
        }
      } catch (err) {
        setStatusMessage({ type: 'error', text: err.message || 'Failed to fetch user data.' });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserCreds(prev => ({ ...prev, [name]: value }));
  };

  // Avatar Upload Handler
  const uploadAvatar = async (event) => {
    try {
      setUploadingAvatar(true);
      setStatusMessage({ type: '', text: '' });

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      
      const { data: { user } } = await supabase.auth.getUser();
      const filePath = `${user.id}/${fileName}`; // Matches your secure user ID policy rule

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update profiles table column
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 4. Update state instantly
      setUserCreds(prev => ({ ...prev, avatarUrl: publicUrl }));
      setStatusMessage({ type: 'success', text: 'Avatar updated successfully!' });

    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message });
    } finally {
      setUploadingAvatar(false);
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in.');

      // 1. Update profiles table (Full Name & Username)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: userCreds.fullName,
          username: userCreds.username.trim().toLowerCase()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Update Auth email if changed
      if (userCreds.email !== originalEmail) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: userCreds.email
        });

        if (emailError) throw emailError;

        setStatusMessage({
          type: 'success',
          text: 'Profile updated! A confirmation link has been sent to your new email.'
        });
        setOriginalEmail(userCreds.email);
      } else {
        setStatusMessage({ type: 'success', text: 'Profile changes saved successfully!' });
      }

    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
    }
  };

  return (
    <div className="settings-container fade-in">
      
      {/* Settings Page Header */}
      <div className="settings-page-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Manage your account, preferences, and security.</p>
      </div>

      <div className="settings-split-layout">
        
        {/* Local Sidebar Tabs */}
        <aside className="settings-tabs-sidebar">
          <button 
            className={`tab-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
            Profile Settings
          </button>
          
          <button 
            className={`tab-nav-btn ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M4.098 19.902a3.75 3.75 0 0 1 0-5.304l6.401-6.401M4.098 19.902l9.22-9.22a3.75 3.75 0 0 1 5.304 0l.22.22a3.75 3.75 0 0 1 0 5.304l-9.22 9.22M13.32 12.18a3.75 3.75 0 0 0-5.304 0l-1.06 1.061M16.5 16.518c.243-.024.486-.055.728-.092A2.056 2.056 0 0 0 19 14.43c0-.785-.515-1.492-1.31-1.63a11.114 11.114 0 0 0-1.657-.134" /></svg>
            Appearance
          </button>
          
          <button 
            className={`tab-nav-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
            Security
          </button>
        </aside>

        {/* Dynamic Content Display Area */}
        <main className="settings-content-display">
          
          {/* PROFILE SECTION */}
          {activeTab === 'profile' && (
            <section className="settings-solid-panel">
              <div className="panel-header">
                <h2>Profile Settings</h2>
                <p>Update your personal information and public profile identity.</p>
              </div>
              
              <div className="panel-body">
                <div className="profile-avatar-row">
                  <div className="avatar-circle" style={{ overflow: 'hidden' }}>
                    {userCreds.avatarUrl ? (
                      <img 
                        src={userCreds.avatarUrl} 
                        alt="Profile Avatar" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      userCreds.fullName ? userCreds.fullName.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>

                  {/* Hidden file input element */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadAvatar}
                    disabled={uploadingAvatar}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                  />

                  <button 
                    type="button" 
                    className="btn-secondary-dark"
                    onClick={() => fileInputRef.current.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                  </button>
                </div>

                {statusMessage.text && (
                  <div className={`status-banner ${statusMessage.type}`} style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    marginTop: '15px',
                    backgroundColor: statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                    color: statusMessage.type === 'error' ? '#f87171' : '#4ade80',
                    border: `1px solid ${statusMessage.type === 'error' ? '#ef4444' : '#22c55e'}`
                  }}>
                    {statusMessage.text}
                  </div>
                )}

                <form onSubmit={handleProfileSave} className="form-stack">
                  <div className="settings-form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      name="fullName"
                      className="settings-field" 
                      value={userCreds.fullName}
                      onChange={handleInputChange}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      name="email"
                      className="settings-field" 
                      value={userCreds.email}
                      onChange={handleInputChange}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Username</label>
                    <input 
                      type="text" 
                      name="username"
                      className="settings-field" 
                      value={userCreds.username}
                      onChange={handleInputChange}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="panel-footer" style={{ marginTop: '20px' }}>
                    <button type="submit" className="btn-black-action" disabled={loading || saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          {/* THEME SECTION */}
          {activeTab === 'appearance' && (
            <section className="settings-solid-panel">
              <div className="panel-header">
                <h2>Appearance</h2>
                <p>Customize your user interface application experience.</p>
              </div>
              
              <div className="panel-body">
                <div className="theme-toggle-grid">
                  <button 
                    className={`theme-selection-btn light-option ${theme === 'light' ? 'selected' : ''}`}
                    onClick={() => setTheme('light')}
                  >
                    <div className="theme-icon-box">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg>
                    </div>
                    <span className="theme-label">Light Mode</span>
                  </button>
                  
                  <button 
                    className={`theme-selection-btn dark-option ${theme === 'dark' ? 'selected' : ''}`}
                    onClick={() => setTheme('dark')}
                  >
                    <div className="theme-icon-box">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>
                    </div>
                    <span className="theme-label">Dark Mode</span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* SECURITY SECTION */}
          {activeTab === 'security' && (
            <section className="settings-solid-panel">
              <div className="panel-header">
                <h2>Security</h2>
                <p>Keep your account secure by updating your account password regularly.</p>
              </div>
              
              <div className="panel-body">
                <div className="form-stack">
                  <div className="settings-form-group">
                    <label>Current Password</label>
                    <input 
                      type="password" 
                      className="settings-field" 
                      placeholder="••••••••" 
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>New Password</label>
                    <input 
                      type="password" 
                      className="settings-field" 
                      placeholder="••••••••" 
                    />
                  </div>
                </div>
                <div className="panel-footer mt-4">
                  <button className="btn-black-action">Update Password</button>
                </div>
              </div>
            </section>
          )}

        </main>
      </div>
    </div>
  );
}