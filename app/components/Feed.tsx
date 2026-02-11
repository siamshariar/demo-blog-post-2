'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { PostsPage } from '@/lib/types';

export default function Feed() {
  const { ref, inView } = useInView();
  const queryClient = useQueryClient();
  const router = useRouter();
  
  // Prefetch function for post details
  const prefetchPost = (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: ['post', slug],
      queryFn: async () => {
        const res = await fetch(`/api/post/${slug}`);
        if (!res.ok) throw new Error('Failed to fetch post');
        return res.json();
      },
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
  };
  
  // Handle instant modal open
  const handlePostClick = (slug: string) => {
    router.push(`/post/${slug}`);
  };
  
  // This uses the server-prefetched data immediately (Instant Load)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery<PostsPage>({
    queryKey: ['posts'],
    queryFn: async ({ pageParam }) => {
      const res = await fetch(`/api/posts?page=${pageParam}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  // Infinite Scroll Logic
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="border rounded shadow bg-white animate-pulse">
            <div className="w-full h-48 bg-gray-200"></div>
            <div className="p-4 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">Trending Posts</h1>
          <p className="text-black mb-3">Instant-loading with smart caching • Click any post to see the magic ✨</p>
          <div className="flex gap-3 text-xs">
            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">
              🎭 Click = Modal View (instant)
            </span>
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
              📄 Refresh = Detail Page (SEO)
            </span>
            <span className="px-2 py-1 bg-green-50 text-green-700 rounded">
              ⚡ Virtualized Rendering
            </span>
          </divbutton
                key={post.id}
                onClick={() => handlePostClick(post.slug)}
                onMouseEnter={() => prefetchPost(post.slug)}
                className="group text-left w-full cursor-pointer"
              >
                <article className="border rounded-lg shadow-md hover:shadow-2xl transition-all duration-300 bg-white overflow-hidden transform group-hover:-translate-y-1">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={post.thumbnail} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <div className="p-4">
                    <h2 className="font-bold text-lg text-black mb-2 group-hover:text-black transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-black text-sm line-clamp-3 mb-3">
                      {post.shortDesc}
                    </p>
                    <div className="flex items-center justify-between text-xs text-black">
                      <span>{post.author}</span>
                      <span>ID: {post.id}</span>
                    </div>
                  </div>
                </article>
              </button<div className="flex items-center justify-between text-xs text-black">
                      <span>{post.author}</span>
                      <span>ID: {post.id}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))
          )}
        </div>

        {/* Infinite Scroll Trigger */}
        <div ref={ref} className="h-20 flex items-center justify-center mt-8">
          {isFetchingNextPage && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            </div>
          )}
          {!hasNextPage && data && (
            <p className="text-black text-sm">🎉 You've reached the end!</p>
          )}
        </div>
      </div>
    </div>
  );
}