const supabase = require('../config/database');

class Contract {
  static async findAll() {
    const { data, error } = await supabase.from('contracts').select('*, users(full_name, email)');
    if (error) throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('contracts')
      .select('*, users(full_name, email)')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async create(contract) {
    const { data, error } = await supabase
      .from('contracts')
      .insert([contract])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id, fields) {
    const { data, error } = await supabase
      .from('contracts')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase.from('contracts').delete().eq('id', id);
    if (error) throw error;
  }
}

module.exports = Contract;
