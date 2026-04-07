export interface Profile {
  id: string
  display_name: string
  avatar_id: string
  created_at: string
}

export interface Group {
  id: string
  name: string
  created_by: string
  invite_code: string
  created_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: string
  joined_at: string
}
