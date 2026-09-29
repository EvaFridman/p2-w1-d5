import { cache } from "react";
import { randomUUID } from "crypto";

export const getRequestId = cache(() => randomUUID());
