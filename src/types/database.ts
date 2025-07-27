export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          website: string | null;
          is_private: boolean;
          is_verified: boolean;
          followers_count: number;
          following_count: number;
          posts_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          is_private?: boolean;
          is_verified?: boolean;
          followers_count?: number;
          following_count?: number;
          posts_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          is_private?: boolean;
          is_verified?: boolean;
          followers_count?: number;
          following_count?: number;
          posts_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          caption: string | null;
          media_urls: string[];
          media_types: string[];
          location: string | null;
          likes_count: number;
          comments_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          caption?: string | null;
          media_urls: string[];
          media_types: string[];
          location?: string | null;
          likes_count?: number;
          comments_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          caption?: string | null;
          media_urls?: string[];
          media_types?: string[];
          location?: string | null;
          likes_count?: number;
          comments_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          post_id: string | null;
          comment_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id?: string | null;
          comment_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string | null;
          comment_id?: string | null;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          likes_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      stories: {
        Row: {
          id: string;
          user_id: string;
          media_url: string;
          media_type: string;
          duration: number;
          views_count: number;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          media_url: string;
          media_type: string;
          duration?: number;
          views_count?: number;
          created_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          media_url?: string;
          media_type?: string;
          duration?: number;
          views_count?: number;
          created_at?: string;
          expires_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          participants: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          participants: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          participants?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          recipient_id: string;
          content: string | null;
          media_url: string | null;
          media_type: string | null;
          message_type: string;
          is_disappearing: boolean;
          disappear_at: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          recipient_id: string;
          content?: string | null;
          media_url?: string | null;
          media_type?: string | null;
          message_type: string;
          is_disappearing?: boolean;
          disappear_at?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          recipient_id?: string;
          content?: string | null;
          media_url?: string | null;
          media_type?: string | null;
          message_type?: string;
          is_disappearing?: boolean;
          disappear_at?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          actor_id: string;
          type: string;
          post_id: string | null;
          comment_id: string | null;
          title: string;
          body: string | null;
          data: any;
          is_read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          actor_id: string;
          type: string;
          post_id?: string | null;
          comment_id?: string | null;
          title: string;
          body?: string | null;
          data?: any;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          actor_id?: string;
          type?: string;
          post_id?: string | null;
          comment_id?: string | null;
          title?: string;
          body?: string | null;
          data?: any;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      story_views: {
        Row: {
          id: string;
          story_id: string;
          viewer_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          viewer_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          viewer_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type User = Database['public']['Tables']['users']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'];
export type Follow = Database['public']['Tables']['follows']['Row'];
export type Like = Database['public']['Tables']['likes']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type Story = Database['public']['Tables']['stories']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type StoryView = Database['public']['Tables']['story_views']['Row'];

// For backward compatibility, keep Profile as an alias for User
export type Profile = User;
