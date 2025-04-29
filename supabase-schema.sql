-- Product Requests Table
CREATE TABLE product_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  urgency TEXT NOT NULL,
  description TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  user_id UUID,
  response_id UUID
);

-- Request Responses Table
CREATE TABLE request_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES product_requests(id),
  response_text TEXT NOT NULL,
  response_status TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  admin_id UUID
);

-- Feedback Table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  method TEXT,
  text TEXT,
  product TEXT NOT NULL,
  rating INTEGER NOT NULL,
  category TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  response_id UUID
);

-- Feedback Responses Table
CREATE TABLE feedback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID REFERENCES feedback(id),
  response_text TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  admin_id UUID
);

-- Add Foreign Key Constraints for response_id
ALTER TABLE product_requests
ADD CONSTRAINT fk_product_request_response
FOREIGN KEY (response_id) REFERENCES request_responses(id);

ALTER TABLE feedback
ADD CONSTRAINT fk_feedback_response
FOREIGN KEY (response_id) REFERENCES feedback_responses(id);

-- Add Row Level Security Policies
ALTER TABLE product_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;

-- Create Policy for authenticated users to see their own requests/feedback
CREATE POLICY "Users can see their own requests"
  ON product_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can see responses to their requests"
  ON request_responses
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM product_requests
    WHERE product_requests.id = request_responses.request_id
    AND product_requests.user_id = auth.uid()
  ));

CREATE POLICY "Users can see their own feedback"
  ON feedback
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can see responses to their feedback"
  ON feedback_responses
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM feedback
    WHERE feedback.id = feedback_responses.feedback_id
    AND feedback.user_id = auth.uid()
  ));

-- Create Policy for authenticated users to insert their own requests/feedback
CREATE POLICY "Users can insert their own requests"
  ON product_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
  ON feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create Policy for admin role to manage all data
CREATE POLICY "Admins can manage all requests"
  ON product_requests
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins can manage all request responses"
  ON request_responses
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins can manage all feedback"
  ON feedback
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins can manage all feedback responses"
  ON feedback_responses
  USING (auth.role() = 'service_role');

-- Update policies to allow unauthenticated feedback
DROP POLICY IF EXISTS "Users can see their own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can insert their own feedback" ON feedback;

CREATE POLICY "Anyone can see feedback"
  ON feedback
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert feedback"
  ON feedback
  FOR INSERT
  WITH CHECK (true); 