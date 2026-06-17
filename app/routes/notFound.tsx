import ErrorPage from "../components/ErrorPage";

export default function NotFoundPage() {
  return (
    <ErrorPage
      status="404"
      statusText="The requested page could not be found."
    />
  );
}
