
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapterFactory = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter: adapterFactory } as any);

async function main() {
    const slug = "buxani-counseling-care-or-mental-health-counseling-services-in-miami";
    const provider = await prisma.provider.findFirst({
        where: { slug },
        include: {
            therapies: { include: { therapy: true } },
            city: true,
            neighborhood: true
        }
    });

    if (!provider) {
        console.log("Provider NOT FOUND");
        return;
    }

    console.log("Name:", provider.name);
    console.log("Slug:", provider.slug);
    console.log("PhotoURL:", provider.photoUrl);
    console.log("Description Length:", provider.description ? provider.description.length : 0);
    console.log("Description:", provider.description);
    console.log("Therapies:", provider.therapies.map(t => t.therapy.name).join(", "));
    console.log("City:", provider.city?.name);
    console.log("Neighborhood:", provider.neighborhood?.name);
}

main();
