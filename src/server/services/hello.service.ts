/* ----------------- import procedure ----------------------- */

import { orpc } from "@/server/core";
import { logic } from "@/server/functions/hello.function";
import { z } from "zod";


/* ----------------- expose procedure ----------------------- */

const hello_route = {
  method: "GET",
  path: "/hello",
} as const;

/* ----------------- schema procedure ----------------------- */

const hello_input = z.object({});

const hello_output = z.object({
  message: z.string(),
});

/* ----------------- logic procedure ----------------------- */

const hello_logic = async () => logic();

/* ----------------- router procedure ----------------------- */

export const hello_router = {

  hello: orpc
    .route(hello_route)
    .input(hello_input)
    .output(hello_output)
    .handler(hello_logic)
    .actionable(),

}