const supabase = require('../config/database');

class Content {
  static async findAll() {
    const { data, error } = await supabase.from('content').select('*, users(full_name)');
    if (error) throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('content')
      .select('*, users(full_name)')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async create(content) {
    const { data, error } = await supabase
      .from('content')
      .insert([content])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id, fields) {
    const { data, error } = await supabase
      .from('content')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase.from('content').delete().eq('id', id);
    if (error) throw error;
  }
}

module.exports = Content;
