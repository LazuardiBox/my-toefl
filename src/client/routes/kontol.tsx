import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/kontol')({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: 'Kontol',
      },
    ],
  }),
})

function RouteComponent() {
  return <div>Hello "/kontol"!</div>
}
