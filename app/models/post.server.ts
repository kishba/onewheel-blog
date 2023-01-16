import { prisma } from "~/db.server";

export async function getPosts() {
  return prisma.post.findMany();
}

export async function getPostLisitings() {
  return prisma.post.findMany({
    select: {
      slug: true,
      title: true,
    },
  });
}
