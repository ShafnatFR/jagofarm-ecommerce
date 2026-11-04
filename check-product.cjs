const { prisma } = require("./src/lib/prisma");
(async () => {
  const id = "764da8d1-edff-4c51-883c-3759d27e5810";
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: true,
      category: { select: { id: true, name: true, slug: true } },
      _count: { select: { orderItems: true, reviews: true } },
    },
  });
  if (!product) {
    console.log("PRODUCT NOT FOUND");
    process.exit(0);
  }
  console.log(JSON.stringify(product, null, 2));
  await prisma.$disconnect();
})().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
