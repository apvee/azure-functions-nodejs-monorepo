import { app } from "@azure/functions";
import { z } from "zod";

export const ErrorResponseSchema = z.object({
    code: z.number().int().describe("The error code"),
    message: z.string().describe("The error message"),
}).describe("The error response");
app.openAPISchema('ErrorResponse', ErrorResponseSchema);

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
