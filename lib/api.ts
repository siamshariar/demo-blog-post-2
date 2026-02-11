import { Post, PostsPage } from './types';

// Mock data generator
const generateMockPosts = (start: number, count: number): Post[] => {
  const posts: Post[] = [];
  
  for (let i = start; i < start + count; i++) {
    posts.push({
      id: i,
      slug: `post-${i}`,
      title: `Amazing Post #${i}: Exploring Modern Web Development`,
      shortDesc: `Discover the incredible insights about web development, performance optimization, and user experience in this comprehensive article. Learn how to build better applications.`,
      thumbnail: `https://picsum.photos/seed/${i}/800/600`,
      content: `
        <h2>Introduction</h2>
        <p>This is the full content of post #${i}. In a real application, this would contain rich HTML content with images, videos, and more.</p>
        
        <h3>Key Points</h3>
        <ul>
          <li>Performance optimization strategies</li>
          <li>Modern React patterns and best practices</li>
          <li>SEO-friendly architecture</li>
          <li>User experience improvements</li>
        </ul>
        
        <h3>Deep Dive</h3>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
        
        <h3>Advanced Concepts</h3>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
        
        <blockquote>
          "The best way to predict the future is to invent it." - Alan Kay
        </blockquote>
        
        <h3>Conclusion</h3>
        <p>By implementing these patterns, you can create incredibly fast and user-friendly applications that scale to millions of pages while maintaining excellent performance.</p>
      `,
      author: `Author ${i % 10}`,
      publishedAt: new Date(Date.now() - i * 3600000).toISOString(),
    });
  }
  
  return posts;
};

// Simulate database
let allPosts: Post[] = [];

// Initialize with 100,000 posts for demo
if (allPosts.length === 0) {
  allPosts = generateMockPosts(1, 100000);
}

// API Functions
export async function getTrendingPosts({ pageParam = 1 }: { pageParam?: number }): Promise<PostsPage> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const PAGE_SIZE = 48;
  const start = (pageParam - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  
  const items = allPosts.slice(start, end);
  const hasMore = end < allPosts.length;
  
  return {
    items,
    nextPage: hasMore ? pageParam + 1 : null,
    hasMore,
  };
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  // Simulate network delay for full content
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const post = allPosts.find(p => p.slug === slug);
  
  if (!post) return null;
  
  // Add related posts (excluding the current post)
  const relatedIndices = [
    Math.max(0, post.id - 2),
    Math.max(0, post.id - 1),
    Math.min(allPosts.length - 1, post.id + 1),
    Math.min(allPosts.length - 1, post.id + 2),
  ];
  
  return {
    ...post,
    relatedPosts: relatedIndices
      .map(i => allPosts[i])
      .filter(p => p && p.id !== post.id) // Exclude current post
      .slice(0, 3), // Only take 3 related posts
  };
}
