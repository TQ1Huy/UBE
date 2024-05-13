const fs = import("fs");

async function deleteAllFilesInDir(dirPath) {
  try {
    const files = fs.readdir(dirPath);

    const deleteFilePromises = files.map((file) =>
      fs.unlink(path.join(dirPath, file))
    );

    await Promise.all(deleteFilePromises);
  } catch (err) {
    console.log(err);
  }
}

module.exports = deleteAllFilesInDir;
