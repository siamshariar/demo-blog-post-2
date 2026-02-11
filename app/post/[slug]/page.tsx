// app/post/[slug]/page.tsx - SEO-Friendly Direct Page
import { Metadata } from 'next';
import { getPostBySlug } from '@/lib/api';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PostDetailClient from '@/app/components/PostDetailClient';
import PostContainer from '@/app/components/PostContainer';

// Server-side Data Fetching
async function getPost(slug: string) {
  const post = await getPostBySlug(slug);
  if (!post) return null;
  return post;
}

// SEO Metadata (Critical for Search Engines)
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }
  
  return { 
    title: post.title,
    description: post.shortDesc,
    openGraph: {
      title: post.title,
      description: post.shortDesc,
      images: [post.thumbnail],
    },
  };
}

// The SEO Page (Server Component)
export default async function PostPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <PostContainer header={
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-black hover:text-black mb-6 group cursor-pointer"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      }>
        <PostDetailClient post={post} />
      </PostContainer>
    </div>
  );
}