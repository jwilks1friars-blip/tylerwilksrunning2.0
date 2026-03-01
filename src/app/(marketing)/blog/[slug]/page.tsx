export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return <div>Blog post: {params.slug}</div>
}
