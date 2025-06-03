import { db } from '../libs/db.js'
import { getJudge0LanguageId, pollBatchResults, submitBatch } from '../libs/judge0.libs.js'

export const createProblem = async (req, res) => {
    const {
      title,
      description,
      difficulty,
      tags,
      examples,
      constraints,
      testcases,
      codeSnippets,
      referenceSolution,
    } = req.body;
  
    // going to check the user role once again
  
    try {
      for (const [language, solutionCode] of Object.entries(referenceSolution)) {
        const languageId = getJudge0LanguageId(language);
  
        if (!languageId) {
          return res
            .status(400)
            .json({ error: `Language ${language} is not supported` });
        }
  
        //
        const submissions = testcases.map(({ input, output }) => ({
          source_code: solutionCode,
          language_id: languageId,
          stdin: input,
          expected_output: output,
        }));
  
        const submissionResults = await submitBatch(submissions);
  
        const tokens = submissionResults.map((res) => res.token);
  
        const results = await pollBatchResults(tokens);
  
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          console.log("Result-----", result);
          // console.log(
          //   `Testcase ${i + 1} and Language ${language} ----- result ${JSON.stringify(result.status.description)}`
          // );
          if (result.status.id !== 3) {
            return res.status(400).json({
              error: `Testcase ${i + 1} failed for language ${language}`,
            });
          }
        }
      }
  
      const newProblem = await db.problem.create({
        data: {
          title,
          description,
          difficulty,
          tags,
          examples,
          constraints,
          testcases,
          codeSnippets,
          referenceSolution,
          userId: req.user.id,
        },
      });
  
      return res.status(201).json({
        success: true,
        message: "Message Created Successfully",
        problem: newProblem,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: "Error While Creating Problem",
      });
    }
  };

export const getAllProblems = async (req, res) => {
    try {
        const problems = await db.problem.findMany();

        if(!problems){
            return res.status(404).json({
                error:"No problems found"
            })
        }

        res.status(200).json({
            success: true,
            message: "Message Fetched Successfully",
            problem: problems,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
        error: "Error While Fetching Problem",
      });
    }
}
export const getProblemById = async (req, res) => {
    const {id} = req.params

    try {
        const problem = await db.problem.findUnique({
            where:{
                id
            }
        })

        if(!problem){
            return res.status(404).json({error:"Problem not found"})
        }

        return res.status(200).json({
            success: true,
            message: "Message Created Successfully",
            problem
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
        error: "Error While Fetching Problem by id",
      });
    }
}
export const deleteProblemById = async (req, res) => {
    const {id} = req.params

   try {
     const problem = await db.problem.findUnique({
         where:{
             id
         }
     })
 
     if(!problem){
         return res.status(404).json({error:"Problem not found"})
     }
 
     await db.problem.delete({
         where:{
             id
         }
     })

     res.status(200).json({
        success:true,
        message:"Problem deleted successully"
     })
   } catch (error) {
    console.log(error)
    return res.status(500).json({
        error: "Error While Deleting Problem",
      });
   }
}
export const getAllProblemsSolvedByUser = async (req, res) => {
try {
  const problems = await db.problem.findMany({
    where:{
      solvedBy:{
        some:{
          user:req.user.id
        }
      }
    },
    include:{
      solvedBy:{
        where:{
          userId:req.user.id
        }
      }
    }
  })

  res.status(200).json({
    success:true,
    message:"problems fetched successfully",
    problems
  })
} catch (error) {
  console.error("Error fetching problems",error)
  res.status(500).json({error:"failed to fetch problem"})
}
}
export const updateProblemById = async (req, res) => {

}
