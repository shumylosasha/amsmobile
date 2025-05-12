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
      const { data: feedback, error: getError } = await supabase
        .from('feedback')
        .select('*')
        .order('timestamp', { ascending: false });

      if (getError) throw getError;
      return res.status(200).json(feedback);

    case 'POST':
      const { product, rating, text, photo_url, is_critical } = req.body;
      
      if (!product || !rating || !text) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { data: newFeedback, error: postError } = await supabase
        .from('feedback')
        .insert([
          {
            product,
            rating,
            text,
            photo_url,
            is_critical,
            timestamp: new Date().toISOString()
          }
        ])
        .select();

      if (postError) throw postError;
      return res.status(201).json(newFeedback[0]);

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default errorHandler(handler); 