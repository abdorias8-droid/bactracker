// ═══════════════════════════════════════════════════════════════════
// SUPABASE — Auth + Database       window.SB
// ─────────────────────────────────────────────────────────────────
// SETUP: Replace the two lines below with your own Supabase project
//   → Supabase dashboard → Project Settings → API
// ═══════════════════════════════════════════════════════════════════

const SUPABASE_URL  = 'https://qudskozdiyzkowhqsfnj.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1ZHNrb3pkaXl6a293aHFzZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNjAyMzgsImV4cCI6MjA5MjYzNjIzOH0.3Lv2E-oZwYc8rVQQ7AtjEwgVST8hS3eBRb2SpdPq6KE';

const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

window.SB = {
  currentUser: null,

  // ── AUTH ──────────────────────────────────────────────────────────
  async signIn() {
    const { error } = await _sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname
      }
    });
    if (error) throw error;
  },

  async signOut() {
    if (this.currentUser) {
      await this.setOffline(this.currentUser.id).catch(() => {});
    }
    const { error } = await _sb.auth.signOut();
    if (error) throw error;
  },

  onAuthChange(callback) {
    const { data: { subscription } } = _sb.auth.onAuthStateChange((event, session) => {
      this.currentUser = session?.user ?? null;
      callback(this.currentUser);
    });
    return () => subscription.unsubscribe();
  },

  // ── PROFILES ──────────────────────────────────────────────────────
  async getProfile(uid) {
    const { data } = await _sb.from('profiles').select('*').eq('id', uid).maybeSingle();
    return data;
  },

  async saveProfile(uid, data) {
    await _sb.from('profiles').upsert({ id: uid, ...data }, { onConflict: 'id' });
  },

  async getProfiles(ids) {
    if (!ids || ids.length === 0) return [];
    const { data } = await _sb.from('profiles').select('*').in('id', ids);
    return data || [];
  },

  async findUserByEmail(email) {
    const { data } = await _sb
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();
    return data;
  },

  // ── USER DATA ──────────────────────────────────────────────────────
  async loadUserData(uid) {
    const { data } = await _sb.from('user_data').select('*').eq('user_id', uid).maybeSingle();
    return data;
  },

  async saveUserData(uid, payload) {
    const { error } = await _sb.from('user_data').upsert({
      user_id:   uid,
      subjects:  payload.subjects,
      progress:  payload.progress,
      notes:     payload.notes,
      favorites: payload.favorites,
      settings:  payload.settings,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
    if (error) throw error;
  },

  // ── PRESENCE ──────────────────────────────────────────────────────
  async setStudying(uid, { subjectId, subjectName, visible }) {
    await _sb.from('presence').upsert({
      user_id:      uid,
      subject_id:   subjectId,
      subject_name: subjectName,
      visible:      visible !== false,
      online:       true,
      updated_at:   new Date().toISOString()
    }, { onConflict: 'user_id' });
  },

  async setOffline(uid) {
    await _sb.from('presence').upsert({
      user_id:      uid,
      online:       false,
      subject_id:   null,
      subject_name: null,
      updated_at:   new Date().toISOString()
    }, { onConflict: 'user_id' });
  },

  watchPresence(uids, callback) {
    if (!uids || uids.length === 0) return () => {};

    const fetch = async () => {
      const { data } = await _sb.from('presence').select('*').in('user_id', uids);
      const map = {};
      (data || []).forEach(p => { map[p.user_id] = p; });
      callback(map);
    };

    fetch();

    const channel = _sb.channel('presence_' + Date.now())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presence' }, payload => {
        const uid = payload.new?.user_id || payload.old?.user_id;
        if (uids.includes(uid)) fetch();
      })
      .subscribe();

    return () => _sb.removeChannel(channel);
  },

  // ── FRIENDS ──────────────────────────────────────────────────────
  async getFriendships(uid) {
    const { data } = await _sb
      .from('friendships')
      .select('id, requester_id, addressee_id')
      .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`)
      .eq('status', 'accepted');
    return (data || []).map(f => ({
      friendId:     f.requester_id === uid ? f.addressee_id : f.requester_id,
      friendshipId: f.id
    }));
  },

  async getPendingRequests(uid) {
    const { data } = await _sb
      .from('friendships')
      .select('id, requester_id, created_at')
      .eq('addressee_id', uid)
      .eq('status', 'pending');
    if (!data || data.length === 0) return [];
    const profiles = await this.getProfiles(data.map(r => r.requester_id));
    const pMap = {};
    profiles.forEach(p => { pMap[p.id] = p; });
    return data.map(r => ({ ...r, profile: pMap[r.requester_id] || {} }));
  },

  async getSentRequests(uid) {
    const { data } = await _sb
      .from('friendships')
      .select('id, addressee_id, created_at')
      .eq('requester_id', uid)
      .eq('status', 'pending');
    if (!data || data.length === 0) return [];
    const profiles = await this.getProfiles(data.map(r => r.addressee_id));
    const pMap = {};
    profiles.forEach(p => { pMap[p.id] = p; });
    return data.map(r => ({ ...r, profile: pMap[r.addressee_id] || {} }));
  },

  async sendFriendRequest(fromUid, toUid) {
    const { error } = await _sb.from('friendships').insert({
      requester_id: fromUid,
      addressee_id: toUid,
      status: 'pending'
    });
    if (error) {
      if (error.code === '23505') throw new Error('Demande déjà envoyée');
      throw error;
    }
  },

  async acceptFriendRequest(requestId) {
    const { error } = await _sb.from('friendships')
      .update({ status: 'accepted' })
      .eq('id', requestId);
    if (error) throw error;
  },

  async rejectFriendRequest(requestId) {
    const { error } = await _sb.from('friendships').delete().eq('id', requestId);
    if (error) throw error;
  },

  async removeFriend(myUid, friendUid) {
    await _sb.from('friendships')
      .delete()
      .or(`and(requester_id.eq.${myUid},addressee_id.eq.${friendUid}),and(requester_id.eq.${friendUid},addressee_id.eq.${myUid})`);
  },

  watchFriendships(uid, callback) {
    const channel = _sb.channel('friendships_' + uid)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, callback)
      .subscribe();
    return () => _sb.removeChannel(channel);
  }
};
