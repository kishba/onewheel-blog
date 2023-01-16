import {
  Form,
  useActionData,
  useParams,
  useTransition,
  useLoaderData,
  useCatch,
} from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import {
  createPost,
  deletePost,
  getPost,
  updatePost,
} from "~/models/post.server";
import invariant from "tiny-invariant";
import { requireAdminUser } from "~/session.server";
import type { Post } from "~/models/post.server";

type LoaderData = { post?: Post };

type ActionData =
  | { title: null | string; slug: null | string; markdown: null | string }
  | undefined;

const inputClassName =
  "w-full rounded border border-gray-500 px-2 py-1 text-lg";

export const loader: LoaderFunction = async ({ request, params }) => {
  await requireAdminUser(request);
  invariant(params.slug, "slug is required");
  if (params.slug === "new") {
    return json<LoaderData>({});
  }
  const post = await getPost(params.slug);

  // example of causing an error that will render nearest ErrorBoundary
  // const html = post.html();
  // throw new Error("whatever happened");

  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }
  // TODO Handle 404 to prevent typescript complaining about post here
  return json<LoaderData>({ post });
};

export const action: ActionFunction = async ({ request, params }) => {
  await requireAdminUser(request);
  invariant(params.slug, "slug is required");

  // return new Response(null, {
  //   status: 302,
  //   headers: {
  //     Location: "/posts/admin",
  //   },
  // });
  // console.log(await request.formData());
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    await deletePost(params.slug);
    return redirect("/posts/admin");
  }

  // Quick exploration of how to console log formData
  // https://stackoverflow.com/a/45673708
  // console.log(JSON.stringify(formData)); // only {}
  // console.log(...formData); // arrays of what is included in pairs
  // console.table(Object.fromEntries(formData)); // pretty table if all unique
  // console.log(formData.get("title"));

  const title = formData.get("title");
  const slug = formData.get("slug");
  const markdown = formData.get("markdown");

  const errors: ActionData = {
    title: title ? null : "Title is required",
    slug: slug ? null : "Slug is required",
    markdown: markdown ? null : "Markdown is required",
  };
  const hasErrors = Object.values(errors).some((errorMessage) => errorMessage);
  if (hasErrors) {
    // Kent in egghead.io
    return json<ActionData>(errors);
    // Brandon considering sending more back in the paylod
    // return json({ errors });
  }

  invariant(typeof title === "string", "title must be a string");
  invariant(typeof slug === "string", "slug must be a string");
  invariant(typeof markdown === "string", "markdown must be a string");

  if (params.slug === "new") {
    await createPost({ title, slug, markdown });
  } else {
    await updatePost(params.slug, { title, slug, markdown });
  }
  return redirect("/posts/admin");
};

export default function NewPostRoute() {
  const data = useLoaderData() as LoaderData;
  // Kent in eggheadio
  const errors = useActionData() as ActionData;
  // const data = useActionData();
  // Brandon considering sending more back in the paylod
  // const { errors } = data || {};

  const transition = useTransition();
  // Cool there can be so many transitions happening on a page!
  // you can check what transition is going on, but let's assume one
  // transition.submission?.formData
  // transition.submission?.action
  const isCreating = transition.submission?.formData.get("intent") === "create";
  const isUpdating = transition.submission?.formData.get("intent") === "update";
  const isDeleting = transition.submission?.formData.get("intent") === "delete";
  const isNewPost = !data.post;

  return (
    <Form method="post" key={data.post?.slug ?? "new"}>
      <p>
        <label>
          Post Title:{" "}
          {errors?.title ? (
            <em className="text-red-600">{errors.title}</em>
          ) : null}
          <input
            type="text"
            name="title"
            className={inputClassName}
            defaultValue={data.post?.title}
          />
        </label>
      </p>
      <p>
        <label>
          Post Slug:
          {errors?.slug ? (
            <em className="text-red-600">{errors.slug}</em>
          ) : null}
          <input
            type="text"
            name="slug"
            className={inputClassName}
            defaultValue={data.post?.slug}
          />
        </label>
      </p>
      <p>
        <label htmlFor="markdown">
          Markdown:{" "}
          {errors?.markdown ? (
            <em className="text-red-600">{errors.markdown}</em>
          ) : null}
        </label>
        <textarea
          name="markdown"
          id="markdown"
          rows={20}
          className={`${inputClassName} font-mono`}
          defaultValue={data.post?.markdown}
        ></textarea>
      </p>
      <div className="flex justify-end gap-4">
        {isNewPost ? null : (
          <button
            type="submit"
            name="intent"
            value="delete"
            className="rounded bg-red-500 py-2 px-4 text-white hover:bg-red-600 focus:bg-red-400 disabled:bg-red-300"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        )}
        <button
          type="submit"
          name="intent"
          value={isNewPost ? "create" : "update"}
          className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
          disabled={isCreating || isUpdating}
        >
          {isNewPost ? (isCreating ? "Creating..." : "Create Post") : null}
          {isNewPost ? null : isUpdating ? "Updating..." : "Update"}
        </button>
      </div>
    </Form>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();
  if (caught.status === 404) {
    return (
      <div>Uh oh! The post with the slug "{params.slug}" does not exist!</div>
    );
  }
  throw new Error(`Unsupported thrown response status code: ${caught.status}`);
}
