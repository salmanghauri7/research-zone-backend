const typeDefs = `#graphql
  """A workspace summary used in the dashboard workspace list."""
  type Workspace {
    _id: ID!
    title: String!
    isOwner: Boolean!
    color: String
  }

  """Workspace metadata shown in the workspace-specific dashboard banner."""
  type WorkspaceMeta {
    _id: ID!
    title: String!
    description: String
    color: String
    createdAt: String!
  }

  """Aggregate statistics for a workspace dashboard."""
  type DashboardStats {
    totalMembers: Int!
    totalPapers: Int!
    activityChange: Int!
  }

  """A workspace member ranked by contribution."""
  type Contributor {
    _id: ID!
    name: String!
    email: String!
    avatar: String
    role: String!
    papersCount: Int!
  }

  """A recently saved paper entry."""
  type RecentPaper {
    _id: ID!
    title: String!
    author: String!
    savedAt: String!
    tag: String!
  }

  """A single day's activity data point."""
  type ActivityPoint {
    day: String!
    value: Int!
  }

  """Full workspace dashboard payload."""
  type WorkspaceDashboard {
    workspace: WorkspaceMeta!
    stats: DashboardStats!
    topContributors: [Contributor!]!
    recentPapers: [RecentPaper!]!
    activityData: [ActivityPoint!]!
  }

  type Query {
    """Get all workspaces the authenticated user belongs to (owned + member)."""
    allWorkspaces: [Workspace!]!

    """Get the full dashboard data for a specific workspace."""
    workspaceDashboard(workspaceId: ID!): WorkspaceDashboard!
  }
`;

export default typeDefs;
