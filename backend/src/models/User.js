const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

class User {
  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async create({ email, password, full_name, role }) {
    const hashed = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password_hash: hashed, full_name, role }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id, fields) {
    const { data, error } = await supabase
      .from('users')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  }
}

module.exports = User;
