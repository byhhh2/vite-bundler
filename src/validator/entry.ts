export const validateInsideSrcFolder = (entry: string) => {
  if (entry.includes('src')) {
    return entry
  } else {
    throw new Error(`set a file inside the 'src' folder as the entry`)
  }
}
