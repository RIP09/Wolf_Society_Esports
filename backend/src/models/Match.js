const supabase = require('../config/database');

class Match {
  static async findAll() {
    const { data, error } = await supabase.from('matches').select('*, teams(name)');
    if (error) throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('matches')
      .select('*, teams(name)')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async create(match) {
    const { data, error } = await supabase
      .from('matches')
      .insert([match])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id, fields) {
    const { data, error } = await supabase
      .from('matches')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (error) throw error;
  }
}

module.exports = Match;
