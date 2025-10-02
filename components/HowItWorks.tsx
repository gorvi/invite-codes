export default function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Copy the invite code above",
      description: "Click on any available invite code to copy it to your clipboard"
    },
    {
      number: "2", 
      title: "Visit sora.chatgpt.com/explore and enter the code",
      description: "Go to the official Sora website and paste the code in the invitation field"
    },
    {
      number: "3",
      title: "Vote whether it worked or not", 
      description: "Help the community by voting on whether the code worked for you"
    },
    {
      number: "4",
      title: "Submit your own codes to help others",
      description: "Once you get access, share your invite codes with the community"
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">How It Works</h3>
      
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
              {step.number}
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">{step.title}</h4>
              <p className="text-gray-600 text-sm">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


