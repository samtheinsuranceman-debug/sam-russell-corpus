// ============================================================
// ARRIVAL ROUTER — mounted as `arrival`.
//   arrival.begin   auth   one arrival on the signed-in home: picks this session's
//                          skin (never one of the last 7, full rotation before
//                          repeats), stores the history, returns the skin plus the
//                          seed for the user's sonic signature.
// The client calls it once per browser session, and only when the arrival field is
// switched on (VITE_ARRIVAL_SKINS=on or the owner's preview), so production is
// unchanged until the owner flips the flag.
// ============================================================
import { protectedProcedure, router } from "./_core/trpc";
import { beginArrival } from "./arrivalSkinsDb";

export const arrivalRouter = router({
  begin: protectedProcedure.mutation(({ ctx }) => beginArrival(ctx.user.id)),
});
