import { Form } from "@remix-run/react";
import type { ActionFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createPost } from "~/models/post.server";

const inputClassName =
  "w-full rounded border border-gray-500 px-2 py-1 text-lg";

export const action: ActionFunction = async ({ request }) => {
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
  console.log(JSON.stringify(formData)); // only {}
  console.log(...formData); // arrays of what is included in pairs
  console.table(Object.fromEntries(formData)); // pretty table if all unique
  console.log(formData.get("title"));

  const title = formData.get("title");
  const slug = formData.get("slug");
  const markdown = formData.get("markdown");
  await createPost({ title, slug, markdown });
  return redirect("/posts/admin");
};
export default function NewPostRoute() {
  return (
    <Form action="." method="post">
      <p>
        <label>
          Post Title:
          <input type="text" name="title" className={inputClassName} />
        </label>
      </p>
      <p>
        <label>
          Post Slug:
          <input type="text" name="slug" className={inputClassName} />
        </label>
      </p>
      <p>
        <label htmlFor="markdown"></label>
        <textarea
          name="markdown"
          id="markdown"
          rows={20}
          className={`${inputClassName} font-mono`}
        ></textarea>
      </p>
      <p className="text-right">
        <button
          type="submit"
          className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
        >
          Create Post
        </button>
      </p>
    </Form>
  );
}
