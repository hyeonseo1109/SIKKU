import { Directory, File, Paths } from "expo-file-system";

export const getProjectsDirectory = () =>
  new Directory(Paths.document, "projects");

export const getProjectDirectory = (projectId: string) =>
  new Directory(getProjectsDirectory(), projectId);

export const getProjectFile = (projectId: string) =>
  new File(getProjectDirectory(projectId), "project.json");

export const ensureProjectDirectories = (projectId: string) => {
  const projectDirectory = getProjectDirectory(projectId);
  projectDirectory.create({ idempotent: true, intermediates: true });

  const assetsDirectory = new Directory(projectDirectory, "assets");
  assetsDirectory.create({ idempotent: true, intermediates: true });

  for (const name of [
    "originals",
    "processed",
    "background",
    "decoration",
    "hands",
    "digits",
  ]) {
    new Directory(assetsDirectory, name).create({
      idempotent: true,
      intermediates: true,
    });
  }

  return projectDirectory;
};
