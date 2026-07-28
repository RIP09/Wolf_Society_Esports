const supabase = require('../config/database');

class Announcement {
  static async findAll() {
    const { data, error } = await supabase.from('announcements').select('*, users(full_name)');
    if (error) throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('announcements')
      .select('*, users(full_name)')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async create(announcement) {
    const { data, error } = await supabase
      .from('announcements')
      .insert([announcement])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id, fields) {
    const { data, error } = await supabase
      .from('announcements')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;
  }
}

module.exports = Announcement;
