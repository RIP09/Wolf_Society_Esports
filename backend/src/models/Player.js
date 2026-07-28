const supabase = require('../config/database');

class Player {
  static async findAll() {
    const { data, error } = await supabase
      .from('players')
      .select('*, users(full_name, email), teams(name)');
    if (error) throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('players')
      .select('*, users(full_name, email), teams(name)')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async create(player) {
    const { data, error } = await supabase
      .from('players')
      .insert([player])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id, fields) {
    const { data, error } = await supabase
      .from('players')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) throw error;
  }
}

module.exports = Player;
