import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Question = {
  id: string;
  subject: string;
  topic: string | null;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  explanation: string | null;
  source: string | null;
  figure_url: string | null;
  created_at: string;
};

export type TestSession = {
  id: string;
  visitor_id: string;
  mode: "study" | "exam";
  status: "active" | "completed" | "abandoned";
  subject: string | null;
  topic: string | null;
  current_index: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  score_percent: number;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
};

export type TestSessionAnswer = {
  id: string;
  session_id: string;
  question_id: string;
  selected_option: "A" | "B" | "C" | "D";
  correct_option: "A" | "B" | "C" | "D";
  is_correct: boolean;
  answered_at: string;
};
