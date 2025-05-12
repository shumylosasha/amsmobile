import { createClient } from '@supabase/supabase-js';
import { errorHandler, validateRequest } from './utils';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function handler(req, res) {
  validateRequest(req, res, () => {});

  switch (req.method) {
    case 'GET':
      const { data: requests, error: getError } = await supabase
        .from('product_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (getError) throw getError;
      return res.status(200).json(requests);

    case 'POST':
      const { name, details } = req.body;
      
      if (!name || !details) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { data: newRequest, error: postError } = await supabase
        .from('product_requests')
        .insert([
          {
            name,
            details,
            status: 'pending',
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (postError) throw postError;
      return res.status(201).json(newRequest[0]);

    case 'DELETE':
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Missing request ID' });
      }

      const { error: deleteError } = await supabase
        .from('product_requests')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      return res.status(200).json({ message: 'Request deleted successfully' });

    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default errorHandler(handler); 