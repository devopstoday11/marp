import path from 'path'
import dotProp from 'dot-prop'
import {
  GetStaticPaths,
  GetStaticPropsContext,
  InferGetStaticPropsType,
} from 'next'
import Link from 'next/link'
import { Typography } from 'components/Typography'
import { Layout } from 'components/docs/Layout'
import { parse, renderToReact } from 'utils/markdown'

const defaultSlug = ['concept', 'introduction']
const docsCtx = () => require.context('docs', true, /\.md$/)

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: [
    '/docs',
    ...docsCtx()
      .keys()
      .map((id) => path.join('/docs/', id).slice(0, -3)),
  ],
  fallback: false,
})

export const getStaticProps = async ({ params }: GetStaticPropsContext) => {
  // Manifest
  const { default: manifest } = await import('docs/manifest.yaml')

  // Page data
  const slug = ([] as string[]).concat(params?.slug ?? defaultSlug)
  const { default: md } = await import(`docs/${path.join(...slug)}.md`)
  const { data, mdast } = await parse(md)

  // Breadcrumbs
  const breadcrumbs = slug.map((sl, i) => {
    const slugs = slug.slice(0, i + 1)
    const key = slugs.join('/')
    const data = dotProp.get<any>(
      { pages: manifest },
      slugs.flatMap((s) => ['pages', s]).join('.')
    )
    const hasLink = docsCtx().keys().includes(`./${key}.md`)

    return {
      key,
      title: data?.title || sl,
      ...(hasLink ? { link: `/docs/${key}` } : {}),
    }
  })

  return { props: { breadcrumbs, data, manifest, mdast, slug } }
}

const Docs = ({
  breadcrumbs,
  manifest,
  mdast,
  slug,
}: InferGetStaticPropsType<typeof getStaticProps>) => (
  <Layout breadcrumbs={breadcrumbs} manifest={manifest} slug={slug}>
    <Typography>{renderToReact(mdast)}</Typography>
  </Layout>
)

export default Docs
