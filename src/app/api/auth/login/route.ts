import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        // หา user
        const { data: rows, error: userError } = await supabase.from("users").select("*").eq("email", email);
        if (userError) throw userError;

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { message: "ไม่พบ user" },
                { status: 404 }
            );
        }

        const user = rows[0];

        // เช็ค password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return NextResponse.json(
                { message: "รหัสผ่านผิด" },
                { status: 401 }
            );
        }

        // success
        return NextResponse.json({
            message: "login สำเร็จ",
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "error" },
            { status: 500 }
        );
    }
}