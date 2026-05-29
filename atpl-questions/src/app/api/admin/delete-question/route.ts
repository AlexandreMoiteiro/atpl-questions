import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const questionId = String(body?.questionId ?? "").trim();
    const questionText = String(body?.questionText ?? "").trim();
    const subject = String(body?.subject ?? "").trim();
    const topic = String(body?.topic ?? "").trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase environment variables." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    let idToDelete = questionId;

    if (!idToDelete) {
      if (!questionText) {
        return NextResponse.json(
          { ok: false, error: "Missing question id/text." },
          { status: 400 }
        );
      }

      let query = supabase
        .from("questions")
        .select("id")
        .eq("question_text", questionText)
        .limit(1);

      if (subject) query = query.eq("subject", subject);
      if (topic) query = query.eq("topic", topic);

      const { data, error } = await query.maybeSingle();

      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 }
        );
      }

      if (!data?.id) {
        return NextResponse.json(
          { ok: false, error: "Question not found." },
          { status: 404 }
        );
      }

      idToDelete = String(data.id);
    }

    const { error: deleteError } = await supabase
      .from("questions")
      .delete()
      .eq("id", idToDelete);

    if (deleteError) {
      return NextResponse.json(
        { ok: false, error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, deletedId: idToDelete });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      },
      { status: 500 }
    );
  }
}
