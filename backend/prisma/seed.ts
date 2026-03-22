import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const dayOffset = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash("password123", 12);

  const [demoUser, teamUser] = await Promise.all([
    prisma.user.upsert({
      where: { email: "demo@cloudcue.app" },
      update: {},
      create: {
        email: "demo@cloudcue.app",
        name: "Demo User",
        passwordHash,
        avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Demo%20User"
      }
    }),
    prisma.user.upsert({
      where: { email: "team@cloudcue.app" },
      update: {},
      create: {
        email: "team@cloudcue.app",
        name: "Team User",
        passwordHash,
        avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Team%20User"
      }
    })
  ]);

  const projects = await Promise.all([
    prisma.project.upsert({
      where: { id: "11111111-1111-1111-1111-111111111111" },
      update: { name: "Website Redesign", color: "#C2F04B" },
      create: {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Website Redesign",
        description: "Revamp marketing website and improve conversion UX.",
        color: "#C2F04B"
      }
    }),
    prisma.project.upsert({
      where: { id: "22222222-2222-2222-2222-222222222222" },
      update: { name: "Mobile App", color: "#BFA9BA" },
      create: {
        id: "22222222-2222-2222-2222-222222222222",
        name: "Mobile App",
        description: "Deliver the first cross-platform app release.",
        color: "#BFA9BA"
      }
    }),
    prisma.project.upsert({
      where: { id: "33333333-3333-3333-3333-333333333333" },
      update: { name: "Backend API", color: "#3D5387" },
      create: {
        id: "33333333-3333-3333-3333-333333333333",
        name: "Backend API",
        description: "Stabilize API contracts and optimize response times.",
        color: "#3D5387"
      }
    })
  ]);

  for (const project of projects) {
    await prisma.projectMember.upsert({
      where: { userId_projectId: { userId: demoUser.id, projectId: project.id } },
      update: { role: "owner" },
      create: { userId: demoUser.id, projectId: project.id, role: "owner" }
    });

    await prisma.projectMember.upsert({
      where: { userId_projectId: { userId: teamUser.id, projectId: project.id } },
      update: { role: "editor" },
      create: { userId: teamUser.id, projectId: project.id, role: "editor" }
    });
  }

  await prisma.task.deleteMany({ where: { projectId: { in: projects.map((project) => project.id) } } });

  const taskSeeds = [
    { title: "Audit current landing page", status: "todo", priority: "high", projectId: projects[0].id, assigneeId: demoUser.id, dueDate: dayOffset(2), position: 0 },
    { title: "Create hero section variants", status: "in_progress", priority: "urgent", projectId: projects[0].id, assigneeId: teamUser.id, dueDate: dayOffset(1), position: 0 },
    { title: "Finalize typography scale", status: "in_review", priority: "medium", projectId: projects[0].id, assigneeId: demoUser.id, dueDate: dayOffset(3), position: 0 },
    { title: "Ship navigation refactor", status: "done", priority: "low", projectId: projects[0].id, assigneeId: teamUser.id, dueDate: dayOffset(-1), position: 0 },
    { title: "Define onboarding flow", status: "todo", priority: "medium", projectId: projects[1].id, assigneeId: teamUser.id, dueDate: dayOffset(4), position: 0 },
    { title: "Implement offline caching", status: "in_progress", priority: "high", projectId: projects[1].id, assigneeId: demoUser.id, dueDate: dayOffset(5), position: 0 },
    { title: "QA push notifications", status: "in_review", priority: "urgent", projectId: projects[1].id, assigneeId: teamUser.id, dueDate: dayOffset(2), position: 0 },
    { title: "Publish TestFlight build", status: "done", priority: "medium", projectId: projects[1].id, assigneeId: demoUser.id, dueDate: dayOffset(-2), position: 0 },
    { title: "Add token rotation", status: "todo", priority: "urgent", projectId: projects[2].id, assigneeId: demoUser.id, dueDate: dayOffset(1), position: 0 },
    { title: "Optimize task query indexes", status: "in_progress", priority: "high", projectId: projects[2].id, assigneeId: teamUser.id, dueDate: dayOffset(6), position: 0 },
    { title: "Write integration tests", status: "in_review", priority: "medium", projectId: projects[2].id, assigneeId: demoUser.id, dueDate: dayOffset(3), position: 0 },
    { title: "Deploy v1 API docs", status: "done", priority: "low", projectId: projects[2].id, assigneeId: teamUser.id, dueDate: dayOffset(-3), position: 0 }
  ];

  for (const [index, task] of taskSeeds.entries()) {
    await prisma.task.create({
      data: {
        title: task.title,
        description: `${task.title} for sprint planning and delivery alignment.`,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        estimatedHours: 2 + (index % 5),
        position: task.position,
        projectId: task.projectId,
        assigneeId: task.assigneeId
      }
    });
  }

  await prisma.commentMention.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.pagePermission.deleteMany();
  await prisma.pageFile.deleteMany();
  await prisma.page.deleteMany();

  const productRoadmap = await prisma.page.create({
    data: {
      title: "Product Roadmap",
      emoji: "🗺️",
      content: [{ type: "heading", props: { level: 1 }, content: "Product Roadmap" }],
      contentText: "Product roadmap and strategic milestones",
      createdById: demoUser.id,
      position: 0
    }
  });

  const q1Goals = await prisma.page.create({
    data: {
      title: "Q1 Goals",
      emoji: "🎯",
      parentId: productRoadmap.id,
      content: [
        { type: "heading", props: { level: 1 }, content: "Q1 Goals" },
        { type: "paragraph", content: "Deliver customer-focused outcomes with measurable impact." },
        { type: "heading", props: { level: 2 }, content: "Objectives" },
        { type: "bulletListItem", content: "Launch adaptive dashboard redesign" },
        { type: "bulletListItem", content: "Reduce cycle time by 20%" },
        { type: "callout", props: { type: "success" }, content: "Focus on shipping over over-planning." },
        { type: "table", content: [["Initiative", "Owner", "Status"], ["Workspace", "Demo User", "In Progress"]] }
      ],
      contentText: "Q1 goals heading objectives bullet list callout and table",
      createdById: demoUser.id,
      position: 0
    }
  });

  const q2Goals = await prisma.page.create({
    data: {
      title: "Q2 Goals",
      emoji: "🚀",
      parentId: productRoadmap.id,
      content: [{ type: "heading", props: { level: 1 }, content: "Q2 Goals" }],
      contentText: "Q2 goals",
      createdById: demoUser.id,
      position: 1
    }
  });

  await prisma.page.create({
    data: {
      title: "Feature Specs",
      emoji: "📋",
      parentId: q2Goals.id,
      content: [{ type: "paragraph", content: "Feature specifications and technical notes." }],
      contentText: "Feature specs and technical notes",
      createdById: demoUser.id,
      position: 0
    }
  });

  const teamHandbook = await prisma.page.create({
    data: {
      title: "Team Handbook",
      emoji: "📖",
      content: [{ type: "heading", props: { level: 1 }, content: "Team Handbook" }],
      contentText: "Team handbook and onboarding",
      createdById: demoUser.id,
      position: 1
    }
  });

  await prisma.page.createMany({
    data: [
      {
        title: "Onboarding",
        emoji: "👋",
        parentId: teamHandbook.id,
        content: [{ type: "paragraph", content: "Welcome to CloudCue team workflows." }],
        contentText: "Onboarding page",
        createdById: demoUser.id,
        position: 0
      },
      {
        title: "Design System",
        emoji: "🎨",
        parentId: teamHandbook.id,
        content: [{ type: "paragraph", content: "Component standards and usage notes." }],
        contentText: "Design system",
        createdById: demoUser.id,
        position: 1
      }
    ]
  });

  const allPages = await prisma.page.findMany({ select: { id: true } });
  for (const page of allPages) {
    await prisma.pagePermission.createMany({
      data: [
        { pageId: page.id, userId: demoUser.id, role: "editor" },
        { pageId: page.id, userId: teamUser.id, role: "editor" }
      ],
      skipDuplicates: true
    });
  }

  const topComment = await prisma.comment.create({
    data: {
      pageId: q1Goals.id,
      authorId: teamUser.id,
      content: "@[Demo User] this section is clear and actionable."
    }
  });

  await prisma.comment.create({
    data: {
      pageId: q1Goals.id,
      authorId: demoUser.id,
      parentId: topComment.id,
      content: "Thanks, I will add milestones next."
    }
  });

  await prisma.comment.create({
    data: {
      pageId: q1Goals.id,
      authorId: demoUser.id,
      content: "Please validate owner assignments by Friday.",
      resolvedAt: new Date()
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
