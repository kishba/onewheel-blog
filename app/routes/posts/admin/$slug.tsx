import {
  Form,
  useActionData,
  useParams,
  useTransition,
  useLoaderData,
} from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { createPost, getPost, updatePost } from "~/models/post.server";
import invariant from "tiny-invariant";
import { requireAdminUser } from "~/session.server";

type ActionData =
  | { title: null | string; slug: null | string; markdown: null | string }
  | undefined;

const inputClassName =
  "w-full rounded border border-gray-500 px-2 py-1 text-lg";

export const loader: LoaderFunction = async ({ request, params }) => {
  await requireAdminUser(request);
  if (params.slug === "new") {
    return json({});
  }
  const post = await getPost(params.slug);
  return json({ post });
};

export const action: ActionFunction = async ({ request, params }) => {
  await requireAdminUser(request);

  // return new Response(null, {
  //   status: 302,
  //   headers: {
  //     Location: "/posts/admin",
  //   },
  // });
  // console.log(await request.formData());
  const formData = await request.formData();

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
  const data = useLoaderData();
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
      <p className="text-right">
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
      </p>
    </Form>
  );
}
