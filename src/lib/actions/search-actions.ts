"use server";

import { searchAdminContent } from "@/lib/search/admin-search";

export async function searchAdminAction(query: string) {
  return searchAdminContent(query);
}
