import { redirect } from "@sveltejs/kit";
import type { PageServerLoadEvent } from "./$types";

export function load(event: PageServerLoadEvent) {
    if (event.locals.session !== null && event.locals.user !== null) {
        return redirect(302, "/");
    }
    return {};
}