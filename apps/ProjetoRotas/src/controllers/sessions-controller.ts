import { Request, Response } from "express";
import { supabase, SCHEMA, TABLES } from "@/configs/supabase";
import { AppError } from "@/utils/AppErrors";
import { sign } from "jsonwebtoken";
import { authConfig } from "@/configs/auth";
import { compare } from "bcrypt";
import { z } from "zod";

class SessionsController {
  async handle(request: Request, response: Response) {
    const bodySchema = z.object({
      email: z.string().email({ message: "E-mail inválido" }),
      password: z.string(),
    });

    const { email, password } = bodySchema.parse(request.body);

    const { data: user, error } = await supabase
      .schema(SCHEMA)
      .from(TABLES.usuario)
      .select("*")
      .eq("a008_user_email", email.toLowerCase())
      .single();

    if (error || !user) {
      throw new AppError("E-mail ou senha incorretos", 401);
    }

    const passwordMatch = await compare(password, user.a008_user_senha);

    if (!passwordMatch) {
      throw new AppError("E-mail ou senha incorretos", 401);
    }

    const secret = process.env.JWT_SECRET || authConfig.jwt.secret;
    const token = sign(
      { role: user.a008_user_tipo },
      secret,
      { subject: user.a008_id, expiresIn: authConfig.jwt.expiresIn }
    );

    response.json({
      token,
      user: { id: user.a008_id, email: user.a008_user_email, tipo: user.a008_user_tipo },
    });
  }
}

export { SessionsController };
